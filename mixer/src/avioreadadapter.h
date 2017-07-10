#ifndef AVIOREADADAPTER_H
#define AVIOREADADAPTER_H

#include <QByteArray>

class AVIOContext;

class AvioReadAdapter
{
public:
    AvioReadAdapter();
    ~AvioReadAdapter();

    AvioReadAdapter(const AvioReadAdapter &) = delete;
    AvioReadAdapter &operator =(const AvioReadAdapter &) = delete;

    AVIOContext *getCtx() const;

    void addData(const QByteArray &data);
    int available() const;

private:
    static int read(void *opaque, unsigned char *buf, int buf_size);

    QByteArray data_;
    unsigned char* buffer_;
    AVIOContext *ctx_;
};

#endif // AVIOREADADAPTER_H
