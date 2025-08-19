# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [0.0.7] - 2025-08-19

### Added

- Notify when new LTS is available

## [0.0.6] - 2024-02-22

### Added

- Added `failOnEocp` configuration option. When set to `true`, it will fail the build. Also, due to the async nature of the check, make this task the first and all others dependent in this task using the `afterTask` setting.

## [0.0.1 - 0.0.5] - 2024-02-14

### Added

- Initial version
