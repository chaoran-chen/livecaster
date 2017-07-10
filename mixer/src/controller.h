#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QWebSocketServer>
#include <QHash>
#include <QTimer>

class StreamMixer;

class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(QObject *parent = nullptr);

private:
    void onNewConnection();
    void sendMixedAudio();

    QWebSocketServer server_;
    QHash<QString, StreamMixer*> groups_;
    QHash<QString, int> groupRefCount_;
    QTimer sendTimer_;
};

#endif // CONTROLLER_H
