#ifndef CASTERCONNECTION_H
#define CASTERCONNECTION_H

#include <QObject>
#include <QWebSocket>
#include "audiodecoder.h"

class CasterConnection : public QObject
{
    Q_OBJECT
public:
    explicit CasterConnection(QWebSocket *socket, QObject *parent = nullptr);
    ~CasterConnection();

    QString groupId() const;

signals:
    void groupJoined(QString groupId);
    void audioReceived(SampleBuffer audio, qint64 offset);
    void disconnected();

private:
    void onMessage(const QByteArray &message);

    QWebSocket *socket_;
    AudioDecoder decoder_;
    bool isFistMessage_ = true;
    qint64 offset_ = 0;
    QString groupId_;
};

#endif // CASTERCONNECTION_H
