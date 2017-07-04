#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QWebSocketServer>


class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(QObject *parent = nullptr);

private:
    void onNewConnection();

    QWebSocketServer server_;

};

#endif // CONTROLLER_H
