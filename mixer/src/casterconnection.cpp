#include "casterconnection.h"

#include <QDebug>

CasterConnection::CasterConnection(QWebSocket *socket, QObject *parent) : QObject(parent)
{
    connect(socket, &QWebSocket::binaryMessageReceived, this, &CasterConnection::onMessage);
    connect(socket, &QWebSocket::disconnected, this, &CasterConnection::disconnected);
}

CasterConnection::~CasterConnection()
{
    delete socket_;
}

QString CasterConnection::groupId() const
{
    return groupId_;
}

void CasterConnection::onMessage(const QByteArray &message)
{
    if(!isFistMessage_) {
        SampleBuffer rawAudio = decoder_.decode(message);
        audioReceived(rawAudio, offset_);
        offset_ += rawAudio.size();
        return;
    }


    // this is the first message
    // parse and strip header

    // message format is [timestamp]0[groupid]0[audio data]

    int pos = message.indexOf(char(0));
    QByteArray timestamp = message.mid(0, pos);
    const QDateTime recTime = QDateTime::fromString(timestamp, Qt::ISODateWithMs);
    pos = message.indexOf(char(0), pos + 1);
    groupId_ = message.mid(timestamp.size() + 1, pos - timestamp.size() - 1);
    groupJoined(groupId_);

    SampleBuffer rawAudio = decoder_.decode(message.mid(pos + 1));

    // estimate offset:
    // recTime holds time when audio packet was completely recorded on the client (~time of last sample)
    // offset_ is supposed to hold the samples since epoch for the first sample in the audio buffers
    const int samplesPerMs = decoder_.outputSampleRate() / 1000;
    const int rawAudioMs = rawAudio.size() / samplesPerMs;
    const QDateTime firstSampleTimestamp = recTime.addMSecs(-rawAudioMs);
    offset_ = firstSampleTimestamp.toMSecsSinceEpoch() * samplesPerMs;

    if(!rawAudio.empty()) {
        audioReceived(rawAudio, offset_);
    }
    offset_ += rawAudio.size();
    isFistMessage_ = false;
}
