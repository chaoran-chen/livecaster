QT += core websockets
QT -= gui

CONFIG += c++11

TARGET = mixer
CONFIG += console
CONFIG -= app_bundle

TEMPLATE = app

INCLUDEPATH += $${PWD}/../include

win32:LIBS += -L$${PWD}/../lib/windows
linux:LIBS += -L$${PWD}/../lib/linux
LIBS += -lavformat -lavcodec -lavutil -lswresample

DEFINES += QT_DEPRECATED_WARNINGS

SOURCES += main.cpp \
    controller.cpp \
    audiodecoder.cpp \
    casterconnection.cpp \
    avioreadadapter.cpp \
    aviowriteadapter.cpp \
    streammixer.cpp \
    dashaudioencoder.cpp


HEADERS += \
    controller.h \
    audiodecoder.h \
    casterconnection.h \
    common.h \
    avioreadadapter.h \
    aviowriteadapter.h \
    streammixer.h \
    dashaudioencoder.h
