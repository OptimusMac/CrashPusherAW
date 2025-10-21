ENV_FILE = .env

.PHONY: env up down build logs restart

env:
	@echo "🔧 Проверка .env..."
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "⚙️  .env не найден, запускаю генерацию..."; \
		bash ./generate-env.sh; \
	else \
		echo "✅ .env найден"; \
	fi
	@if grep -q "matches" $(ENV_FILE); then \
		echo ""; \
		echo "⚠️ ВНИМАНИЕ: В .env найдено 'matches' вместо вашего IP!"; \
		echo "⚠️ Перед использованием обязательно замените его на ваш локальный IP."; \
		echo ""; \
	fi

up: env
	@echo "🚀 Чтобы запустить стек, используйте: docker-compose up [-d]"

down:
	@echo "🧹 Остановка контейнеров..."
	docker-compose down

build:
	docker-compose build --no-cache

logs:
	docker-compose logs -f

restart: down up
