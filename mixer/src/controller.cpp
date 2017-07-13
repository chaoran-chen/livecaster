#include "controller.h"
#include "casterconnection.h"
#include "streammixer.h"
#include "dashaudioencoder.h"

#include <QWebSocket>
#include <QFile>
#include <QDir>

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
           CasterGroup &group = groups_[gid];
           group.refCount_ -= 1;
           if(group.refCount_ == 0) {
                qDebug() << "closing group with id" << gid;
                groups_.remove(gid);
            }
        }
    });
    connect(caster, &CasterConnection::groupJoined, [=] (QString groupId) {
        CasterGroup &group = groups_[groupId];
        if(group.refCount_ == 0) {
            QDir().mkdir(groupId);
            group.mixer = std::make_shared<StreamMixer>((QDateTime::currentMSecsSinceEpoch() - bufferTimeMs) * 48, this);
            group.encoder = std::make_shared<DashAudioEncoder>(groupId);
            qDebug() << "opening new group with id" << groupId;
        }
        connect(caster, &CasterConnection::audioReceived,
                groups_[groupId].mixer.get(), &StreamMixer::addAudio);
        group.refCount_ += 1;
    });
}

void Controller::sendMixedAudio()
{
    // send next second of audio
    for(auto itr = groups_.begin(); itr != groups_.end(); ++itr) {
        SampleBuffer audio = itr.value().mixer->getAudio(48000);
        itr.value().encoder->encodeAudio(audio);
    }
}
