#include <QCoreApplication>

#include "controller.h"
#include "audiodecoder.h"

#include <QFile>

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);

    Controller c;

    return a.exec();
}
