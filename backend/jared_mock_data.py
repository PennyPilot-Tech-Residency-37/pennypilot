from sqlalchemy import engine, create_engine
from sqlalchemy.orm import sessionmaker
from models import User, LinkedAccount, Transaction, Goal, TaxInfo
from database_link import SQLALCHEMY_DATABASE_URI

engine = create_engine(SQLALCHEMY_DATABASE_URI)
Session = sessionmaker(bind=engine)
session = Session()

new_user = User(id=777, name="John Johnson", email="johnjohn@john.com", phone="700-700-7000")
session.add(new_user)
session.commit()

new_linked_account = LinkedAccount(id=777, username="johnjuan", password="j0hn7j0hn7", user=new_user)
new_transaction = Transaction(id=707, transaction_date="2017-07-07", transaction_amount=70.13)
new_goal = Goal(id=707, target_amount=70000.07, current_amount=7.07, deadline="2025-08-09")
new_tax_info = TaxInfo(id=777, income1=77.77, income2=89.01, tax_rate=10, total_income=1000, 
                tax_to_save=1200.50, total_saved=100000)



session.add(new_linked_account)
session.add(new_transaction)
session.add(new_goal)
session.add(new_tax_info)
session.commit()
session.close()