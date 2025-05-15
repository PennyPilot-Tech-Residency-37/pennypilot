def setup_home_route(app):
    @app.route('/')
    def home():
        return 'Welcome aboard the PennyPilot backend!'