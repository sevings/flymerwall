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

#ifndef HTMLCREATOR_H
#define HTMLCREATOR_H

#include <QObject>
#include <QTemporaryFile>
#include <QUrl>

class HTMLCreator : public QObject
{
    Q_OBJECT
public:
    HTMLCreator();

signals:

public slots:
    void saveToFile(QString filename, QString html);
    QString tempFile(QString html);

private:
    QTemporaryFile temp;
    void saveFile(QFile *file, QString html);
};

#endif // HTMLCREATOR_H
