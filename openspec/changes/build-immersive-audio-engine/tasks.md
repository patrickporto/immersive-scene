## Fase 1: MVP - Fundação do Audio Engine

### 1. Setup do Projeto

- [ ] 1.1 Adicionar dependências Rust (rusqlite, rodio)
- [ ] 1.2 Adicionar plugins Tauri (fs, sql)
- [ ] 1.3 Configurar capabilities no tauri.conf.json
- [ ] 1.4 Criar estrutura de diretórios para assets

### 2. Database e Models

- [ ] 2.1 Criar migrations SQLite (sound_sets, moods, audio_elements)
- [ ] 2.2 Implementar funções CRUD no Tauri
- [ ] 2.3 Criar stores Zustand para estado

### 3. Upload de Arquivos

- [ ] 3.1 Implementar diálogo de seleção de arquivos
- [ ] 3.2 Validar formatos (OGG, MP3, WAV, FLAC)
- [ ] 3.3 Copiar arquivos para diretório do app
- [ ] 3.4 Extrair metadados básicos

### 4. Engine de Áudio Web

- [ ] 4.1 Criar AudioContext manager
- [ ] 4.2 Implementar carregamento de arquivos
- [ ] 4.3 Criar sistema de playback (play/pause/stop)
- [ ] 4.4 Implementar 5 canais de mixagem

### 5. Interface UI

- [ ] 5.1 Criar layout base (Sidebar + Main + Mixer)
- [ ] 5.2 Implementar SoundSet Browser
- [ ] 5.3 Criar componente de upload
- [ ] 5.4 Implementar controles do mixer

### 6. Integração

- [ ] 6.1 Conectar UI com stores
- [ ] 6.2 Integrar Tauri commands
- [ ] 6.3 Testar fluxo completo
- [ ] 6.4 Validar persistência
