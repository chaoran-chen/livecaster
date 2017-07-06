#include "controller.h"
#include "casterconnection.h"

#include <QWebSocket>

Controller::Controller(QObject *parent) : QObject(parent),
    server_("localhost", QWebSocketServer::NonSecureMode, this)
{

    connect(&server_, &QWebSocketServer::newConnection, this, &Controller::onNewConnection);
    server_.listen(QHostAddress::Any, 5552);
}

void Controller::onNewConnection()
{
    qDebug() << "got new connection";
    auto socket = server_.nextPendingConnection();
    new CasterConnection(socket, this);
}
