#include "controller.h"
#include "casterconnection.h"
#include "streammixer.h"
#include "dashaudioencoder.h"

#include <QWebSocket>
#include <QFile>
#include <QDir>
#include <QCoreApplication>
#include <QStringList>
#include <QJsonDocument>
#include <QJsonObject>

static const qint64 bufferTimeMs = 1500;

Controller::Controller(QObject *parent) : QObject(parent),
    server_("localhost", QWebSocketServer::NonSecureMode, this),
    sendTimer_(this)
{
    readConfig();

    connect(&server_, &QWebSocketServer::newConnection, this, &Controller::onNewConnection);
    server_.listen(QHostAddress::Any, websocketPort_);
    qDebug() << "listening for websocket connections on port" << websocketPort_;

    connect(&sendTimer_, &QTimer::timeout, this, &Controller::sendMixedAudio);
    sendTimer_.start(1000);
}

void Controller::readConfig()
{
    QFile configFile("livecaster_mixer.json");
    if(configFile.open(QFile::ReadOnly)) {
        QJsonParseError err;
        QJsonDocument doc = QJsonDocument::fromJson(configFile.readAll(), &err);
        if(err.error != QJsonParseError::NoError) {
            qDebug() << "error parsing livecaster_mixer.json:" << err.errorString();
            return;
        }

        QJsonObject config = doc.object();
        websocketPort_ = config["websocket_port"].toInt(websocketPort_);
        outputBasePath_ = config["ouput_path"].toString(outputBasePath_);

    } else {
        qDebug() << "could not find livecaster_mixer.json, using default values";
    }
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
            QString outPath = outputBasePath_ + "/" + groupId;
            QDir().mkpath(outPath);
            group.mixer = std::make_shared<StreamMixer>((QDateTime::currentMSecsSinceEpoch() - bufferTimeMs) * 48, this);
            group.encoder = std::make_shared<DashAudioEncoder>(outPath);
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
