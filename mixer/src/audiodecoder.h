#ifndef AUDIODECODER_H
#define AUDIODECODER_H

#include <QByteArray>
#include <QVector>
#include "avioreadadapter.h"
#include "common.h"

class AVFormatContext;
class AVFrame;
class AVCodecContext;
class SwrContext;
class AVPacket;

class AudioDecoder
{
public:
    AudioDecoder();
    ~AudioDecoder();

    // auto detects the format of encoded data and converts it to raw audio samples
    SampleBuffer decode(const QByteArray &encodedData);
    void setOutputSampleRate(int sampleRate);
    int outputSampleRate() const;

    void printDetectedFormat();

private:
    const char* errorString(int errNum);

    AVFormatContext *formatCtx_;
    AVFrame *frame_;
    AVCodecContext *codecCtx_;
    SwrContext *swrCtx_;
    AVPacket *packet_;

    AvioReadAdapter avio_;
    SampleBuffer pcmBuffer_;
    int outSampleRate_ = 48000;
    bool isOpen_ = false;
    char* errorBuffer_ = nullptr;
};

#endif // AUDIODECODER_H
