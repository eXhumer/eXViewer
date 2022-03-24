#ifndef APPWINDOW_HXX
#define APPWINDOW_HXX
#include <QMainWindow>

class AppWindow : public QMainWindow {
private:
#ifdef WIN32
  bool m_darkMode;
#endif // WIN32
  QTimer *m_liveSessionTimer;
public:
  AppWindow(QWidget *parent = nullptr);
};

#endif // APPWINDOW_HXX
