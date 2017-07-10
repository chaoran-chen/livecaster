#ifndef STREAMMIXER_H
#define STREAMMIXER_H

#include <QObject>

#include "common.h"

class StreamMixer : public QObject
{
    Q_OBJECT
public:
    explicit StreamMixer(qint64 startOffset, QObject *parent = nullptr);

    void addAudio(SampleBuffer audio, qint64 offset);

    SampleBuffer getAudio(qint64 sampleCount);

private:
    qint64 masterOffset_ = 0;
    SampleBuffer mixedAudio_;
};

#endif // STREAMMIXER_H
