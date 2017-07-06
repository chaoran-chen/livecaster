#ifndef QBYTEARRAYAVIO_H
#define QBYTEARRAYAVIO_H

#include <QByteArray>

class AVIOContext;

class QByteArrayAVIO
{
public:
    QByteArrayAVIO();
    ~QByteArrayAVIO();

    QByteArrayAVIO(const QByteArrayAVIO &) = delete;
    QByteArrayAVIO &operator =(const QByteArrayAVIO &) = delete;

    AVIOContext *getCtx() const;

    void feed(const QByteArray &data);
    int available() const;

private:
    static int read(void *opaque, unsigned char *buf, int buf_size);

    QByteArray data_;
    unsigned char* buffer_;
    AVIOContext *ctx_;
};

#endif // QBYTEARRAYAVIO_H
