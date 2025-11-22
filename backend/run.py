from app import create_app
import os

app = create_app()


if __name__ == '__main__':
    # Allow overriding host/port via environment for flexibility in dev
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', '5000'))
    app.run(debug=True, host=host, port=port)