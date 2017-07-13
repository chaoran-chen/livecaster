#ifndef AVIOWRITEADAPTER_H
#define AVIOWRITEADAPTER_H

#include <QByteArray>

class AVIOContext;

class AvioWriteAdapter
{
public:
    AvioWriteAdapter();
    ~AvioWriteAdapter();

    AvioWriteAdapter(const AvioWriteAdapter &) = delete;
    AvioWriteAdapter &operator =(const AvioWriteAdapter&) = delete;

    AVIOContext *getCtx() const;
    QByteArray getData();

private:
    static int write(void *opaque, unsigned char *buf, int buf_size);

    QByteArray data_;
    unsigned char* buffer_;
    AVIOContext *ctx_;
};

#endif // AVIOWRITEADAPTER_H
