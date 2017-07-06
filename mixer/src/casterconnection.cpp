#include "casterconnection.h"

CasterConnection::CasterConnection(QWebSocket *socket, QObject *parent) : QObject(parent)
{
    connect(socket, &QWebSocket::binaryMessageReceived, this, &CasterConnection::onMessage);
}

CasterConnection::~CasterConnection()
{
    delete socket_;
}

void CasterConnection::onMessage(const QByteArray &message)
{
    auto samples = decoder_.decode(message);
    qDebug() << "got" << samples.size() << "samples";
}
