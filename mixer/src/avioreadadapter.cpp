#include "avioreadadapter.h"
#include <QDebug>

extern "C" {
#include "libavformat/avformat.h"
#include "libavformat/avio.h"
}

static const int bufferSize = 5 * 1024;

AvioReadAdapter::AvioReadAdapter()
{
    buffer_ = static_cast<unsigned char*>(av_malloc(bufferSize));
    ctx_ = avio_alloc_context(buffer_, bufferSize, 0, this,
                              &AvioReadAdapter::read, NULL, NULL);
}

AvioReadAdapter::~AvioReadAdapter()
{
    av_free(buffer_);
    av_free(ctx_);
}

AVIOContext *AvioReadAdapter::getCtx() const
{
    return ctx_;
}

void AvioReadAdapter::addData(const QByteArray &data)
{
    data_.append(data);
    ctx_->eof_reached = 0;
    ctx_->error = 0;
}

int AvioReadAdapter::available() const
{
    return data_.size();
}

int AvioReadAdapter::read(void *opaque, unsigned char *buf, int buf_size)
{    
    AvioReadAdapter *self = static_cast<AvioReadAdapter*>(opaque);
    if(self->data_.isEmpty()) {
        qDebug() << "read on emtpy buffer";
        return AVERROR_EOF;
    }

    int readSize = std::min(buf_size, self->data_.size());
    memcpy(buf, self->data_.constData(), readSize);
    self->data_ = self->data_.mid(readSize);

    return readSize;
}





