#include "dashaudioencoder.h"

extern "C" {
#include "libavformat/avformat.h"
#include "libavcodec/avcodec.h"
#include "libavformat/avio.h"
#include "libavutil/opt.h"
}

#include <QString>
#include <QDebug>

DashAudioEncoder::DashAudioEncoder(QString path)
{
    av_register_all();
    errorBuffer_ = new char[1024];

    int res = avformat_alloc_output_context2(&formatCtx_, NULL, "dash", NULL);
    if(res < 0) {
        qDebug() << "error creating format context:" << errorString(res);
        return;
    }

    AVCodec *codec = avcodec_find_encoder(formatCtx_->oformat->audio_codec);
    if(codec == nullptr) {
        qDebug() << "could not find codec" << codec;
        return;
    }

    codecCtx_ = avcodec_alloc_context3(codec);
    codecCtx_->sample_fmt = codec->sample_fmts ? codec->sample_fmts[0] : AV_SAMPLE_FMT_FLT;
    codecCtx_->sample_rate = 48000;
    codecCtx_->bit_rate = 128 * 1024;
    codecCtx_->channels = 1;
    codecCtx_->channel_layout = AV_CH_LAYOUT_MONO;
    codecCtx_->frame_size = codecCtx_->sample_rate;

    stream_ = avformat_new_stream(formatCtx_, NULL);
    stream_->id = formatCtx_->nb_streams - 1;
    stream_->time_base = {1, codecCtx_->sample_rate};

    if(formatCtx_->oformat->flags & AVFMT_GLOBALHEADER) {
        codecCtx_->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
    }

    avcodec_parameters_from_context(stream_->codecpar, codecCtx_);

    res = avcodec_open2(codecCtx_, codec, NULL);
    checkRes(res, "avcodec_open2");

    QByteArray filename = (path + "/livecaster.mpd").toLatin1();
    memcpy(formatCtx_->filename, filename.constData(), filename.size());

    res = avformat_write_header(formatCtx_, NULL);
    checkRes(res, "avformat_write_header");

    frame_ = av_frame_alloc();
    packet_ = av_packet_alloc();

    frame_->nb_samples = codecCtx_->frame_size;
    frame_->format = codecCtx_->sample_fmt;
    frame_->channel_layout = codecCtx_->channel_layout;

    res = av_frame_get_buffer(frame_, 0);
    checkRes(res, "av_frame_get_buffer");
}

DashAudioEncoder::~DashAudioEncoder()
{
    av_write_trailer(formatCtx_);

    avformat_free_context(formatCtx_);
    avcodec_free_context(&codecCtx_);
    av_frame_free(&frame_);
    av_packet_unref(packet_);
    av_packet_free(&packet_);

    delete[] errorBuffer_;
}

void DashAudioEncoder::encodeAudio(SampleBuffer audio)
{
    audioBuffer_.append(audio);

    while(audioBuffer_.size() > codecCtx_->frame_size) {
        int res = av_frame_make_writable(frame_);
        if(res < 0) {
            qDebug() << "error making frame writable:" << errorString(res);
            return;
        }

        // copy raw audio to frame
        memcpy(frame_->data[0], audioBuffer_.constData(), codecCtx_->frame_size * sizeof(float));
        audioBuffer_ = audioBuffer_.mid(codecCtx_->frame_size);

        // set timestamp
        frame_->pts = av_rescale_q(sampleCount_, {1, codecCtx_->sample_rate}, codecCtx_->time_base);
        sampleCount_ += frame_->nb_samples;

        // send frame to encoder
        res = avcodec_send_frame(codecCtx_, frame_);
        checkRes(res, "avcodec_send_frame");
        // read all the available output packets (in general there may be any number of them
        while (res >= 0) {
            res = avcodec_receive_packet(codecCtx_, packet_);
            if (res == AVERROR(EAGAIN) || res == AVERROR_EOF) {
                break;
            } else if (res < 0) {
                qDebug() << "Error encoding audio frame";
                return;
            }
            av_packet_rescale_ts(packet_, codecCtx_->time_base, stream_->time_base);
            packet_->stream_index = stream_->index;
            res = av_interleaved_write_frame(formatCtx_, packet_);
            checkRes(res, "av_interleaved_write_frame");
        }
    }

}

void DashAudioEncoder::checkRes(int res, QString msg)
{
    if(res < 0) {
        qDebug() << msg << errorString(res);
    }
}

const char *DashAudioEncoder::errorString(int errNum)
{
    return av_make_error_string(errorBuffer_, 1024, errNum);
}
