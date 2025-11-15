from app import create_app

app = create_app()

if __name__ == '__main__':
    # Run without the reloader so we get a single process and predictable init behavior
    app.run(debug=False, use_reloader=False)
