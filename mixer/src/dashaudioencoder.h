#ifndef DASHAUDIOENCODER_H
#define DASHAUDIOENCODER_H

#include "aviowriteadapter.h"
#include "common.h"

class AVFormatContext;
class AVFrame;
class AVCodecContext;
class AVPacket;
class AVStream;


class DashAudioEncoder
{
public:
    DashAudioEncoder(QString path);
    ~DashAudioEncoder();

    void encodeAudio(SampleBuffer audio);

private:
    void checkRes(int res, QString msg);
    const char* errorString(int errNum);

    SampleBuffer audioBuffer_;
    AVFormatContext *formatCtx_;
    AVFrame *frame_;
    AVCodecContext *codecCtx_;
    AVPacket *packet_;
    AVStream *stream_;
    char *errorBuffer_;

    int64_t sampleCount_ = 0;

    AvioWriteAdapter avio_;
};

#endif // DASHAUDIOENCODER_H
