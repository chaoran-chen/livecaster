#ifndef QBYTEARRAYAVIO_H
#define QBYTEARRAYAVIO_H

#include <QByteArray>

class AVIOContext;

class QByteArrayAVIO
{
public:
    QByteArrayAVIO(const QByteArray &data);
    ~QByteArrayAVIO();

    QByteArrayAVIO(const QByteArrayAVIO &) = delete;
    QByteArrayAVIO &operator =(const QByteArrayAVIO &) = delete;

    AVIOContext *getCtx() const;

private:
    static int read(void *opaque, unsigned char *buf, int buf_size);
    static int64_t seek(void *opaque, int64_t offset, int whence);

    const QByteArray &data_;
    unsigned char* buffer_;
    AVIOContext *ctx_;
    size_t pos_ = 0;
};

#endif // QBYTEARRAYAVIO_H
