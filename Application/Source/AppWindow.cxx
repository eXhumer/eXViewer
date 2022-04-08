#include "AppWindow.hxx"
#include "eXF1TV/F1TV.hxx"
#include <QClipboard>
#include <QGuiApplication>
#include <QJsonArray>
#include <QJsonObject>
#include <QLineEdit>
#include <QMessageBox>
#include <QPushButton>
#include <QTableWidget>
#include <QTimer>
#include <QVBoxLayout>
#include <QWebEngineCookieStore>
#include <QWebEngineProfile>
#include <QWebEngineView>
#ifdef WIN32
#include <QSettings>
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

  m_liveSessionTimer = new QTimer(this);
  auto f1tvService = new eXF1TV::Service::F1TV(nullptr, this);
  setCentralWidget(new QWidget);
  centralWidget()->setLayout(new QVBoxLayout);
  auto authBtn = new QPushButton("Authorize");
  auto revokeBtn = new QPushButton("Revoke");
  revokeBtn->setDisabled(true);
  auto contentIdLE = new QLineEdit;
  contentIdLE->setPlaceholderText("Content ID");
  contentIdLE->setDisabled(true);
  auto fetchContentStreamsBtn = new QPushButton("Get Content Streams");
  fetchContentStreamsBtn->setDisabled(true);
  QTableWidget *csTable = nullptr;
  centralWidget()->layout()->addWidget(authBtn);
  centralWidget()->layout()->addWidget(revokeBtn);
  centralWidget()->layout()->addWidget(contentIdLE);
  centralWidget()->layout()->addWidget(fetchContentStreamsBtn);
  connect(
      authBtn, &QPushButton::clicked, this,
      [this, authBtn, contentIdLE, revokeBtn, f1tvService,
       fetchContentStreamsBtn](bool) {
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
        connect(weDialog, &QDialog::accepted, this,
                [authBtn, contentIdLE, revokeBtn, fetchContentStreamsBtn]() {
                  authBtn->setDisabled(true);
                  revokeBtn->setEnabled(true);
                  contentIdLE->setEnabled(true);
                  fetchContentStreamsBtn->setEnabled(true);
                });
        connect(f1tvService, &eXF1TV::Service::F1TV::ascendonTokenChanged,
                weDialog, &QDialog::accept);
        connect(f1tvService, &eXF1TV::Service::F1TV::ascendonTokenChanged,
                weDialog, &QDialog::deleteLater);
        connect(weView, &QWebEngineView::loadFinished, weDialog, &QDialog::show,
                Qt::UniqueConnection);
        weView->setUrl(QUrl("https://account.formula1.com/#/en/login"));
      });
  connect(contentIdLE, &QLineEdit::textChanged, this,
          [fetchContentStreamsBtn](const QString &text) {
            fetchContentStreamsBtn->setDisabled(text.isEmpty());
          });
  connect(
      fetchContentStreamsBtn, &QPushButton::clicked, this,
      [this, contentIdLE, fetchContentStreamsBtn, f1tvService, &csTable]() {
        fetchContentStreamsBtn->setDisabled(true);
        connect(
            f1tvService, &eXF1TV::Service::F1TV::contentStreams, this,
            [this, f1tvService, contentIdLE,
             &csTable](long contentId, const QJsonArray &streams) {
              if (contentId == contentIdLE->text().toLong()) {
                auto contentTable = new QTableWidget(this);
                contentTable->setRowCount(streams.count() + 1);
                contentTable->setColumnCount(3);

                for (int i = 0; i < streams.count(); i++) {
                  auto streamObj = streams.at(i);
                  contentTable->setItem(
                      i, 0, new QTableWidgetItem(streamObj["type"].toString()));
                  contentTable->setItem(
                      i, 1,
                      new QTableWidgetItem(streamObj["title"].toString()));
                  auto tokenisedUrlBtn = new QPushButton("Get Tokenised URL");
                  connect(
                      tokenisedUrlBtn, &QPushButton::clicked, this,
                      [this, f1tvService, streamObj]() {
                        connect(
                            f1tvService, &eXF1TV::Service::F1TV::tokenisedUrl,
                            this,
                            [this, streamObj](const QString &playbackUrl,
                                              const QString &tokenisedUrl) {
                              if (playbackUrl ==
                                  streamObj["playbackUrl"].toString()) {
                                auto clipboard = QGuiApplication::clipboard();
                                clipboard->setText(tokenisedUrl);
                                QMessageBox::information(
                                    this, "Tokensied Stream Link",
                                    "Type: " + streamObj["type"].toString() +
                                        "\nTitle: " +
                                        streamObj["title"].toString() +
                                        "\n\nTokenised URL copied to "
                                        "clipboard!");
                              }
                            });
                        f1tvService->queryTokenisedUrl(
                            streamObj["playbackUrl"].toString());
                      });
                  contentTable->setCellWidget(i, 2, tokenisedUrlBtn);
                }
                QDialog *dialog = new QDialog;
                dialog->setLayout(new QVBoxLayout);
                dialog->layout()->addWidget(contentTable);
                dialog->show();
              }
            });
        f1tvService->queryContentStreams(contentIdLE->text().toLong());
      });
  connect(
      revokeBtn, &QPushButton::clicked, this,
      [authBtn, contentIdLE, revokeBtn, f1tvService, fetchContentStreamsBtn]() {
        f1tvService->revoke();
        authBtn->setEnabled(true);
        revokeBtn->setDisabled(true);
        contentIdLE->setText(QString());
        contentIdLE->setDisabled(true);
        fetchContentStreamsBtn->setDisabled(true);
      });
  connect(f1tvService, &eXF1TV::Service::F1TV::liveSessionsAvailable, this,
          [](const QJsonArray &liveSessions) { qDebug() << liveSessions; });
  connect(m_liveSessionTimer, &QTimer::timeout, f1tvService,
          &eXF1TV::Service::F1TV::queryLiveContents);
  connect(f1tvService, &eXF1TV::Service::F1TV::tokenisedUrl, this,
          [](const QString &playbackUrl, const QString &tokenisedUrl) {
            qDebug() << "Tokenised URL for" << playbackUrl;
            qDebug() << "------";
            qDebug() << tokenisedUrl;
          });
  m_liveSessionTimer->start(60 * 1000);
}
