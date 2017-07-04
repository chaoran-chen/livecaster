#include "controller.h"
#include "audiodecoder.h"

#include <QWebSocket>
#include <QDateTime>
#include <QFile>

Controller::Controller(QObject *parent) : QObject(parent),
    server_("localhost", QWebSocketServer::NonSecureMode, this)
{

    connect(&server_, &QWebSocketServer::newConnection, this, &Controller::onNewConnection);
    server_.listen(QHostAddress::Any, 5552);
}

void Controller::onNewConnection()
{
    auto socket = server_.nextPendingConnection();
    qDebug() << "got new connection";

    connect(socket, &QWebSocket::binaryMessageReceived, [=] (const QByteArray &message) {
        qDebug() << "got message with" << message.size() << "bytes";
    });
}
