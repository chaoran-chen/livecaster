#ifndef AUDIODECODER_H
#define AUDIODECODER_H

#include <QByteArray>
#include <QVector>

class AVFormatContext;
class AVFrame;
class AVCodecContext;
class SwrContext;

class AudioDecoder
{
public:
    AudioDecoder();
    ~AudioDecoder();

    // auto detects the format of encoded data and converts it to 48kHz mono samples
    QVector<double> decode(const QByteArray &encodedData, int outSampleRate = 48000);

private:
    AVFormatContext *formatCtx_;
    AVFrame *frame_;
    AVCodecContext *codecCtx_;
    SwrContext *swrCtx_;
};

#endif // AUDIODECODER_H
