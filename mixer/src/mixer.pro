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
    qbytearrayavio.cpp \
    audiodecoder.cpp


HEADERS += \
    controller.h \
    qbytearrayavio.h \
    audiodecoder.h
