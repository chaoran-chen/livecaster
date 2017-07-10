#include "controller.h"
#include "casterconnection.h"
#include "mixer.h"

#include <QWebSocket>
#include <QFile>

static const qint64 bufferTimeMs = 1500;

Controller::Controller(QObject *parent) : QObject(parent),
    server_("localhost", QWebSocketServer::NonSecureMode, this),
    sendTimer_(this)
{

    connect(&server_, &QWebSocketServer::newConnection, this, &Controller::onNewConnection);
    server_.listen(QHostAddress::Any, 5550);

    connect(&sendTimer_, &QTimer::timeout, this, &Controller::sendMixedAudio);
    sendTimer_.start(1000);
}

void Controller::onNewConnection()
{
    qDebug() << "got new connection";
    auto socket = server_.nextPendingConnection();
    auto caster = new CasterConnection(socket, this);

    connect(caster, &CasterConnection::disconnected, [=] {
        const QString gid = caster->groupId();
        if(groups_.contains(gid)) {
            groupRefCount_[gid] -= 1;
            if(groupRefCount_[gid] <= 0) {
                qDebug() << "closing group with id" << gid;
                groups_[gid]->deleteLater();
                groups_.remove(gid);
                groupRefCount_.remove(gid);
            }
        }
    });
    connect(caster, &CasterConnection::groupJoined, [=] (QString groupId) {
        if(!groups_.contains(groupId)) {
            groups_[groupId] = new StreamMixer((QDateTime::currentMSecsSinceEpoch() - bufferTimeMs) * 48, this);
            qDebug() << "opening new group with id" << groupId;
        }
        connect(caster, &CasterConnection::audioReceived, groups_[groupId], &StreamMixer::addAudio);
        groupRefCount_[groupId] += 1;
    });
}

void Controller::sendMixedAudio()
{
    const QString now = QDateTime::currentDateTime().toString("hh_mm_ss");
    // send next second of audio
    for(auto itr = groups_.begin(); itr != groups_.end(); ++itr) {
        QFile outFile(itr.key() + "_" + now + ".rawaudio");
        outFile.open(QFile::WriteOnly | QFile::Truncate);
        SampleBuffer audio = itr.value()->getAudio(48000);
        outFile.write(reinterpret_cast<const char*>(audio.constData()), audio.size() * sizeof(float));
    }
}
