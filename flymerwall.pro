TEMPLATE = app

QT += qml quick widgets network webengine

SOURCES += main.cpp \
    htmlcreator.cpp

RESOURCES += \
    qml.qrc

# Additional import path used to resolve QML modules in Qt Creator's code model
QML_IMPORT_PATH =

# Default rules for deployment.
include(deployment.pri)

DISTFILES += \
    storage.js \
    auth.js

HEADERS += \
    htmlcreator.h
