find_package(Qt6 COMPONENTS MultimediaWidgets Widgets WebEngineWidgets REQUIRED)

add_executable(
${PROJECT_NAME}
    Source/AppWindow.cxx
    Source/Main.cxx
)

target_include_directories(
${PROJECT_NAME}
    PRIVATE
        Include/
)

target_link_libraries(
${PROJECT_NAME}
    PRIVATE
        Qt6::Widgets
        Qt6::WebEngineWidgets
)

if(WIN32)
# set_target_properties(
# ${PROJECT_NAME}
#     PROPERTIES
#         WIN32_EXECUTABLE TRUE
# )

target_link_libraries(
${PROJECT_NAME}
    PRIVATE
        eXF1TV
        dwmapi
)
endif(WIN32)
