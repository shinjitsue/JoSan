# Changelog

All notable changes to JoSan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Release packaging automation script
- Versioning and release management instructions

## [2.1.0] - 2026-01-31

### Added

- Bluesky (bsky.app) platform support
- Bisaya language detection and word list
- Enhanced AI contextual analysis with multilingual support
- Usage dashboard with filtering statistics
- Platform-specific toggle controls

### Changed

- Improved filter engine performance with optimized Bloom filter
- Enhanced language detection accuracy
- Updated UI with better visual feedback

### Fixed

- Memory leak in DOM observer during page navigation
- Race condition in settings synchronization
- Incorrect language detection for mixed-language content

## [2.0.0] - 2025-12-15

### Added

- AI-powered contextual analysis using OpenAI API
- Multi-language support (English, Tagalog)
- Two-stage filtering pipeline (regex + AI)
- Interactive filter mode with reveal option
- Custom word list support
- Privacy filter for DMs and private content
- Usage tracking and statistics

### Changed

- Complete UI redesign with React and Tailwind CSS
- Migrated to Manifest V3 service worker architecture
- Improved performance with Bloom filter pre-screening
- Enhanced Trie-based word matching

### Removed

- Legacy Manifest V2 background page
- jQuery dependency

### Security

- Added privacy-first design (no data collection)
- API key stored locally only
- Private message exclusion by default

## [1.0.0] - 2025-10-01

### Added

- Initial release
- Basic profanity filtering with regex
- Support for Facebook, Twitter, Instagram
- Simple popup interface
- Basic word list (English)

---

[Unreleased]: https://github.com/shinjitsue/JoSan/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/shinjitsue/JoSan/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/shinjitsue/JoSan/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/shinjitsue/JoSan/releases/tag/v1.0.0
