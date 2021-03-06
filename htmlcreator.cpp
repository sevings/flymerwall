/*
  Copyright (C) 2015 Vasily Khodakov
  Contact: Vasily Khodakov <binque@ya.ru>
  All rights reserved.

  This file is part of Flymer Wall.

  Flymer Wall is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Flymer Wall is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Flymer Wall.  If not, see <http://www.gnu.org/licenses/>.
*/

#include "htmlcreator.h"
#include <QDebug>

HTMLCreator::HTMLCreator()
{
    temp.setFileTemplate("flymerwallXXXXXX.html");
}

void HTMLCreator::saveToFile(QString filename, QString html)
{
    QUrl fileurl(filename);
    QFile file(fileurl.toLocalFile());
    saveFile(&file, html);
}

QString HTMLCreator::tempFile(QString html) {
    temp.resize(0);
    saveFile(&temp, html);
    QUrl fileurl(temp.fileName());
    fileurl.setScheme("file");
    return fileurl.toString();
}

void HTMLCreator::saveFile(QFile *file, QString html) {
    if (!file->open(QIODevice::WriteOnly | QIODevice::Text)) {
        qDebug() << "error opening file " << file->fileName();
        return;
    }
    file->write(html.toUtf8());
    file->close();
}
