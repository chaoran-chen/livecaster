#include "qbytearrayavio.h"
#include <QDebug>

extern "C" {
#include "libavformat/avformat.h"
#include "libavformat/avio.h"
}

static const int bufferSize = 5 * 1024;

QByteArrayAVIO::QByteArrayAVIO()
{
    buffer_ = static_cast<unsigned char*>(av_malloc(bufferSize));
    ctx_ = avio_alloc_context(buffer_, bufferSize, 0, this,
                              &QByteArrayAVIO::read, NULL, NULL);
}

QByteArrayAVIO::~QByteArrayAVIO()
{
    av_free(buffer_);
    av_free(ctx_);
}

AVIOContext *QByteArrayAVIO::getCtx() const
{
    return ctx_;
}

void QByteArrayAVIO::feed(const QByteArray &data)
{
    data_.append(data);
    ctx_->eof_reached = 0;
    ctx_->error = 0;
}

int QByteArrayAVIO::available() const
{
    return data_.size();
}

int QByteArrayAVIO::read(void *opaque, unsigned char *buf, int buf_size)
{    
    QByteArrayAVIO *self = static_cast<QByteArrayAVIO*>(opaque);
    if(self->data_.isEmpty()) {
        qDebug() << "read on emtpy buffer";
        return AVERROR_EOF;
    }

    int readSize = std::min(buf_size, self->data_.size());
    memcpy(buf, self->data_.constData(), readSize);
    self->data_ = self->data_.mid(readSize);

    return readSize;
}





