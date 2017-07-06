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
    packet_ = av_packet_alloc();

    formatCtx_->pb = avio_.getCtx();
    formatCtx_->flags = AVFMT_FLAG_CUSTOM_IO;

    errorBuffer_ = new char[1024];
}



AudioDecoder::~AudioDecoder()
{
    avformat_free_context(formatCtx_);
    av_frame_free(&frame_);
    avcodec_free_context(&codecCtx_);
    swr_free(&swrCtx_);

    av_packet_free(&packet_);

    delete[] errorBuffer_;
}


QVector<double> AudioDecoder::decode(const QByteArray &encodedData)
{
    avio_.feed(encodedData);

    if(!isOpen_) {
        qDebug() << "detecting input stream format";
        int ret = avformat_open_input(&formatCtx_, NULL, NULL, NULL);
        if (ret < 0) {
            qDebug() << "could not open input data:" << errorString(ret);
            return QVector<double>();
        }
        ret = avformat_find_stream_info(formatCtx_, NULL);
        if (ret < 0) {
            qDebug() << "could not find stream information:" << errorString(ret);
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
        ret = avcodec_open2(codecCtx_, avcodec_find_decoder(stream->codecpar->codec_id), NULL);
        if(ret < 0) {
            qDebug() << "failed to open decoder for audio stream:" << errorString(ret);
            return QVector<double>();
        }

        // prepare resampler
        av_opt_set_int(swrCtx_, "in_channel_count",  codecCtx_->channels, 0);
        av_opt_set_int(swrCtx_, "out_channel_count", 1, 0);
        av_opt_set_int(swrCtx_, "in_channel_layout",  codecCtx_->channel_layout, 0);
        av_opt_set_int(swrCtx_, "out_channel_layout", AV_CH_LAYOUT_MONO, 0);
        av_opt_set_int(swrCtx_, "in_sample_rate", codecCtx_->sample_rate, 0);
        av_opt_set_int(swrCtx_, "out_sample_rate", outSampleRate_, 0);
        av_opt_set_sample_fmt(swrCtx_, "in_sample_fmt",  codecCtx_->sample_fmt, 0);
        av_opt_set_sample_fmt(swrCtx_, "out_sample_fmt", AV_SAMPLE_FMT_DBL,  0);
        ret = swr_init(swrCtx_);
        if(!swr_is_initialized(swrCtx_)) {
            qDebug() << "resampler has not been properly initialized:" << errorString(ret);
            return QVector<double>();
        }
        isOpen_ = true;
    }

    // decode data
    int pos = 0;
    while(avio_.available() > 0 && av_read_frame(formatCtx_, packet_) == 0) {
        // send packet to decoder
        int ret = avcodec_send_packet(codecCtx_, packet_);
        while (ret == 0) {
            // receive decoded frame from decoder
            ret = avcodec_receive_frame(codecCtx_, frame_);
            if(ret == 0) {
                // frame_ contains decoded raw audio
                // convert frame to target raw audio format

                // prepare output buffer
                int outSamples = swr_get_out_samples(swrCtx_, frame_->nb_samples);  // estimate number of samples after resampling stage (upper bound)
                if(pcmBuffer_.size() < pos + outSamples) {
                    pcmBuffer_.resize(std::max(pos + outSamples, pcmBuffer_.size() * 2));
                }
                uint8_t *out = reinterpret_cast<uint8_t*>(pcmBuffer_.data() + pos);

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
        av_packet_unref(packet_);
    }

    return pcmBuffer_.mid(0, pos);
}

void AudioDecoder::setOutputSampleRate(int sampleRate)
{
    outSampleRate_ = sampleRate;
}

const char *AudioDecoder::errorString(int errNum)
{
    return av_make_error_string(errorBuffer_, 1024, errNum);
}


