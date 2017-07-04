#include "qbytearrayavio.h"

extern "C" {
#include "libavformat/avformat.h"
#include "libavformat/avio.h"
}

static const int bufferSize = 4 * 1024;

QByteArrayAVIO::QByteArrayAVIO(const QByteArray &data) :
    data_(data)
{
    buffer_ = static_cast<unsigned char*>(av_malloc(bufferSize));
    ctx_ = avio_alloc_context(buffer_, bufferSize, 0, this,
                              &QByteArrayAVIO::read, NULL, &QByteArrayAVIO::seek);
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

int QByteArrayAVIO::read(void *opaque, unsigned char *buf, int buf_size)
{
    QByteArrayAVIO *self = static_cast<QByteArrayAVIO*>(opaque);

    auto readSize = std::min(buf_size, static_cast<int>(self->data_.size() - self->pos_));
    memcpy(buf, self->data_.constData() + self->pos_, readSize);
    self->pos_ += readSize;
    return readSize;
}

int64_t QByteArrayAVIO::seek(void *opaque, int64_t offset, int whence)
{
    QByteArrayAVIO *self = static_cast<QByteArrayAVIO*>(opaque);

    if(whence == 0x10000) {
        return self->data_.size();
    }

    if(offset < 0 || self->data_.size() <= offset) {
        return -1;
    }
    self->pos_ = offset;
    return 0;
}




