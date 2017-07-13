#ifndef CONTROLLER_H
#define CONTROLLER_H

#include <QObject>
#include <QWebSocketServer>
#include <QHash>
#include <QTimer>
#include <memory>
#include <QCoreApplication>

class StreamMixer;
class DashAudioEncoder;

struct CasterGroup
{
    int refCount_ = 0;
    std::shared_ptr<StreamMixer> mixer = nullptr;
    std::shared_ptr<DashAudioEncoder> encoder = nullptr;
};

class Controller : public QObject
{
    Q_OBJECT
public:
    explicit Controller(QObject *parent = nullptr);

private:
    void readConfig();
    void onNewConnection();
    void sendMixedAudio();

    QWebSocketServer server_;
    QHash<QString, CasterGroup> groups_;
    QTimer sendTimer_;
    QString outputBasePath_ = QCoreApplication::applicationDirPath() + "/groups/";
    quint16 websocketPort_ = 5550;
};

#endif // CONTROLLER_H
