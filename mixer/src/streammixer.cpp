#include "streammixer.h"

#include <QDebug>

StreamMixer::StreamMixer(qint64 startOffset, QObject *parent) : QObject(parent),
    masterOffset_(startOffset)
{

}

void StreamMixer::addAudio(SampleBuffer audio, qint64 offset)
{
    if(offset + audio.size() < masterOffset_) {
        // already played back
        return;
    }

    qint64 index = offset - masterOffset_;
    if(index < 0) {
        audio = audio.mid(-index);
        index = 0;
    }

    if(index + audio.size() > mixedAudio_.size()) {
        mixedAudio_.resize(index + audio.size());
    }

    for(auto sample : audio) {
        mixedAudio_[index] += sample;
        ++index;
    }
}

SampleBuffer StreamMixer::getAudio(qint64 sampleCount)
{
    if(sampleCount > mixedAudio_.size()) {
        mixedAudio_.resize(sampleCount);
    }

    SampleBuffer res = mixedAudio_.mid(0, sampleCount);
    mixedAudio_ = mixedAudio_.mid(sampleCount);
    masterOffset_ += sampleCount;

    return res;
}



