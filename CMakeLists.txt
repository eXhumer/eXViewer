cmake_minimum_required(VERSION 3.22)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED TRUE)

project(
eXViewer
    LANGUAGES CXX
    VERSION 0.0.0
)

add_subdirectory(Library)
add_subdirectory(Application)
