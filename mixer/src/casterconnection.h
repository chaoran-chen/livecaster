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


private:
    void onMessage(const QByteArray &message);

    QWebSocket *socket_;
    AudioDecoder decoder_;
};

#endif // CASTERCONNECTION_H
