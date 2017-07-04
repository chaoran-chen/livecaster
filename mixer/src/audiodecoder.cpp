#include "audiodecoder.h"

extern "C" {
#include "libavformat/avformat.h"
#include "libavcodec/avcodec.h"
#include "libavformat/avio.h"
#include "libswresample/swresample.h"
#include "libavutil/opt.h"
}

#include <QDebug>

#include "qbytearrayavio.h"

AudioDecoder::AudioDecoder()
{
    av_register_all();
    formatCtx_ = avformat_alloc_context();
    frame_ = av_frame_alloc();
    codecCtx_ = avcodec_alloc_context3(0);
    swrCtx_ = swr_alloc();
}

AudioDecoder::~AudioDecoder()
{
    avformat_free_context(formatCtx_);
    av_frame_free(&frame_);
    avcodec_free_context(&codecCtx_);
    swr_free(&swrCtx_);
}



QVector<double> AudioDecoder::decode(const QByteArray &encodedData, int outSampleRate)
{
    QByteArrayAVIO avio(encodedData);
    formatCtx_->pb = avio.getCtx();

    int ret = avformat_open_input(&formatCtx_, NULL, NULL, NULL);
    if (ret < 0) {
        qDebug() << "could not open input data";
        return QVector<double>();
    }
    ret = avformat_find_stream_info(formatCtx_, NULL);
    if (ret < 0) {
        qDebug() <<  "could not find stream information";
        return QVector<double>();
    }

    // find first mono audio stream
    AVStream *stream = nullptr;
    for(unsigned int i = 0; i < formatCtx_->nb_streams; ++i) {
        if(formatCtx_->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
            stream = formatCtx_->streams[i];
            break;
        }
    }
    av_dump_format(formatCtx_, 0, "QByteArray", 0);
    if(stream == nullptr) {
        qDebug() << "could not find mono audio stream, dumping format information";
        av_dump_format(formatCtx_, 0, "QByteArray", 0);
        return QVector<double>();
    }

    // find & open codec
    if(avcodec_open2(codecCtx_, avcodec_find_decoder(stream->codecpar->codec_id), NULL) < 0) {
        qDebug() << "failed to open decoder for audio stream";
        return QVector<double>();
    }

    // prepare resampler
    av_opt_set_int(swrCtx_, "in_channel_count",  codecCtx_->channels, 0);
    av_opt_set_int(swrCtx_, "out_channel_count", 1, 0);
    av_opt_set_int(swrCtx_, "in_channel_layout",  codecCtx_->channel_layout, 0);
    av_opt_set_int(swrCtx_, "out_channel_layout", AV_CH_LAYOUT_MONO, 0);
    av_opt_set_int(swrCtx_, "in_sample_rate", codecCtx_->sample_rate, 0);
    av_opt_set_int(swrCtx_, "out_sample_rate", outSampleRate, 0);
    av_opt_set_sample_fmt(swrCtx_, "in_sample_fmt",  codecCtx_->sample_fmt, 0);
    av_opt_set_sample_fmt(swrCtx_, "out_sample_fmt", AV_SAMPLE_FMT_DBL,  0);
    swr_init(swrCtx_);
    if(!swr_is_initialized(swrCtx_)) {
        qDebug() << "resampler has not been properly initialized";
        return QVector<double>();
    }

    // prepare decoding
    AVPacket packet;
    av_init_packet(&packet);
    QVector<double> pcmData;
    int pos = 0;

    // decode data
    while(av_read_frame(formatCtx_, &packet) == 0) {
        // send packet to decoder
        int ret = avcodec_send_packet(codecCtx_, &packet);
        while (ret == 0) {
            // receive decoded frame from decoder
            ret = avcodec_receive_frame(codecCtx_, frame_);
            if(ret == 0) {
                // frame_ contains decoded raw audio
                // convert frame to target raw audio format

                // prepare output buffer
                int outSamples = swr_get_out_samples(swrCtx_, frame_->nb_samples);  // estimate number of samples after resampling stage (upper bound)
                if(pcmData.size() < pos + outSamples) {
                    pcmData.resize(std::max(pos + outSamples, pcmData.size() * 2));
                }
                uint8_t *out = reinterpret_cast<uint8_t*>(pcmData.data() + pos);

                // resample & convert to target raw format
                int swrRes = swr_convert(swrCtx_, &out, outSamples, const_cast<const uint8_t**>(frame_->data), frame_->nb_samples);
                if(swrRes < 0) {
                    qDebug() << "swr_convert error:" << swrRes;
                    return QVector<double>();
                }
                // swrRes contains the actual number of samples written to out
                pos += swrRes;
            }
        }
    }
    pcmData.resize(pos);

    avcodec_close(codecCtx_);
    return pcmData;
}


