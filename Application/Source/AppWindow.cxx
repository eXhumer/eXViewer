#include "AppWindow.hxx"
#include "eXF1TV/F1TV.hxx"
#include <QMessageBox>
#include <QPushButton>
#include <QVBoxLayout>
#include <QWebEngineCookieStore>
#include <QWebEngineProfile>
#include <QWebEngineView>
#ifdef WIN32
#include <QSettings>
#include <QTimer>
#include <dwmapi.h>

COLORREF DARK_COLOR = 0x00505050;
COLORREF LIGHT_COLOR = 0x00FFFFFF;
COLORREF DARK_TEXT_COLOR = 0x009B9B9B;
COLORREF LIGHT_TEXT_COLOR = 0x00000000;

bool IsWindowsDarkMode(bool *ok = nullptr) {
  QSettings currentTheme(
      "HKEY_CURRENT_"
      "USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
      QSettings::NativeFormat);
  return currentTheme.value("AppsUseLightTheme").toUInt(ok) == 0;
}

void SetDarkModeStatus(bool useDarkMode, HWND winId) {
  BOOL USE_DARK_MODE = useDarkMode;
  DwmSetWindowAttribute(winId, DWMWINDOWATTRIBUTE::DWMWA_CAPTION_COLOR,
                        USE_DARK_MODE ? &DARK_COLOR : &LIGHT_COLOR,
                        sizeof(USE_DARK_MODE ? DARK_COLOR : LIGHT_COLOR));
  DwmSetWindowAttribute(
      winId, DWMWINDOWATTRIBUTE::DWMWA_TEXT_COLOR,
      USE_DARK_MODE ? &DARK_TEXT_COLOR : &LIGHT_TEXT_COLOR,
      sizeof(USE_DARK_MODE ? DARK_TEXT_COLOR : LIGHT_TEXT_COLOR));
  DwmSetWindowAttribute(winId,
                        DWMWINDOWATTRIBUTE::DWMWA_USE_IMMERSIVE_DARK_MODE,
                        &USE_DARK_MODE, sizeof(USE_DARK_MODE));
}
#endif // WIN32

AppWindow::AppWindow(QWidget *parent) : QMainWindow(parent) {
#ifdef WIN32
  m_darkMode = IsWindowsDarkMode();
  SetDarkModeStatus(m_darkMode, HWND(winId()));

  QTimer *themeChangeTimer = new QTimer(this);
  connect(themeChangeTimer, &QTimer::timeout, this, [this]() {
    bool darkMode = IsWindowsDarkMode();

    if (darkMode != m_darkMode) {
      m_darkMode = darkMode;
      SetDarkModeStatus(m_darkMode, HWND(winId()));
    }
  });
  themeChangeTimer->start(1000);
#endif // WIN32

  auto f1tvService = new eXF1TV::Service::F1TV(nullptr, this);
  setCentralWidget(new QWidget);
  centralWidget()->setLayout(new QVBoxLayout);
  auto authBtn = new QPushButton("Authorize");
  auto revokeBtn = new QPushButton("Revoke");
  revokeBtn->setDisabled(true);
  centralWidget()->layout()->addWidget(authBtn);
  centralWidget()->layout()->addWidget(revokeBtn);
  connect(
      authBtn, &QPushButton::clicked, this,
      [this, authBtn, revokeBtn, f1tvService](bool) {
        QWebEngineProfile::defaultProfile()->cookieStore()->deleteAllCookies();
        auto weDialog = new QDialog(this);
        weDialog->setModal(true);
        auto weView = new QWebEngineView;
        weDialog->setLayout(new QVBoxLayout);
        weDialog->layout()->addWidget(weView);
        connect(weDialog, &QDialog::rejected, this, [this]() {
          QMessageBox::warning(
              this, "User Rejected",
              "User rejected authorization as login window was closed!");
        });
        connect(weDialog, &QDialog::finished, weView, &QWebEngineView::stop);
        connect(weDialog, &QDialog::finished, weView,
                &QWebEngineView::deleteLater);
        connect(weDialog, &QDialog::finished, weDialog, &QDialog::deleteLater);
        connect(weDialog, &QDialog::accepted, this, [authBtn, revokeBtn]() {
          authBtn->setDisabled(true);
          revokeBtn->setEnabled(true);
        });
        connect(f1tvService, &eXF1TV::Service::F1TV::ascendonTokenUpdated,
                weDialog, &QDialog::accept);
        connect(f1tvService, &eXF1TV::Service::F1TV::ascendonTokenUpdated,
                weDialog, &QDialog::deleteLater);
        connect(weView, &QWebEngineView::loadFinished, weDialog, &QDialog::show,
                Qt::UniqueConnection);
        weView->setUrl(QUrl("https://account.formula1.com/#/en/login"));
      });
  connect(revokeBtn, &QPushButton::clicked, this,
          [authBtn, revokeBtn, f1tvService]() {
            f1tvService->revoke();
            authBtn->setEnabled(true);
            revokeBtn->setDisabled(true);
          });
}
