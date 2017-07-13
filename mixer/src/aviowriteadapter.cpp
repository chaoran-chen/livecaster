#include "aviowriteadapter.h"
#include <QDebug>

extern "C" {
#include "libavformat/avformat.h"
#include "libavformat/avio.h"
}

static const int bufferSize = 5 * 1024;

AvioWriteAdapter::AvioWriteAdapter()
{
    buffer_ = static_cast<unsigned char*>(av_malloc(bufferSize));
    ctx_ = avio_alloc_context(buffer_, bufferSize, 0, this,
                              NULL, &AvioWriteAdapter::write, NULL);
}

AvioWriteAdapter::~AvioWriteAdapter()
{
    av_free(buffer_);
    av_free(ctx_);
}

AVIOContext *AvioWriteAdapter::getCtx() const
{
    return ctx_;
}

QByteArray AvioWriteAdapter::getData()
{
    QByteArray res = std::move(data_);
    data_.clear();
    return res;
}

int AvioWriteAdapter::write(void *opaque, unsigned char *buf, int buf_size)
{
    qDebug() << "writing" << buf_size << "bytes";
    auto self = static_cast<AvioWriteAdapter*>(opaque);
    self->data_.append(reinterpret_cast<const char*>(buf), buf_size);
    return buf_size;
}
