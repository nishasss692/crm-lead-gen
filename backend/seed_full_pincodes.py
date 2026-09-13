"""
Seed full Pincode Master Data from user-provided Karnataka Circle dataset into SQLite crm.db.
"""
import os
import sys
import csv
import re

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import PincodeMaster, DB_PATH

sqlite_engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SQLiteSession = sessionmaker(autocommit=False, autoflush=False, bind=sqlite_engine)

CSV_DATA = """Office Name,Pincode,"Delivery/
Non Delivery","Office
Type",Circle,Region,Division,Division ID,Region ID
Bengaluru G.P.O.,560001,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG GPO,21530002,21610001
Fraser Town S.O,560005,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
J C Nagar S.O,560006,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Agram S.O,560007,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
H A L II Stage H.O,560008,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Doorvaninagar S.O,560016,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Vimanapura S.O,560017,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
H A Farm S.O,560024,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Museum Road S.O,560025,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
R T Nagar H.O,560032,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Maruthi Sevanagar S.O,560033,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Krishnarajapuram S.O,560036,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Marathahalli Colony S.O,560037,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Indiranagar S.O (Bengaluru),560038,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Sivan Chetty Gardens S.O,560042,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Kalyananagar S.O,560043,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Arabic College S.O,560045,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Benson Town S.O,560046,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Viveknagar S.O (Bengaluru),560047,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Mahadevapura S.O,560048,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Virgonagar S.O,560049,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
H K P Road S.O,560051,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
A F Station Yelahanka S.O,560063,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Yelahanka S.O,560064,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
G K V K S.O,560065,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Whitefield S.O,560066,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Kadugodi S.O,560067,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Domlur S.O,560071,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
New Thippasandra S.O,560075,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Dr. Shivarama Karanth Nagar S.O,560077,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Sadashivanagar S.O,560080,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
St. Thomas Town S.O,560084,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Vartur S.O,560087,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Sahakaranagar S.O,560092,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
C V Raman Nagar S.O,560093,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
R M V Extension II Stage S.O,560094,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Bellandur S.O,560103,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Horamavu S.O,560113,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Kannamangala S.O,560115,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Doddadunnasandra S.O,560117,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Bengaluru International Airport S.O,560300,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG East,21530001,21610001
Basavanagudi H.O,560004,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Jayangar III Block S.O,560011,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Chamrajpet S.O (Bengaluru),560018,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Governmemnt Electric Factory S.O,560026,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Wilson Garden S.O,560027,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Dharmaram College S.O,560029,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Adugodi S.O,560030,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Koramangala S.O,560034,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Carmelram S.O,560035,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Jayanagar H.O,560041,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Banashankari S.O,560050,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Chickpet S.O,560053,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bnagalore Viswavidalaya S.O,560056,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Rv Niketan S.O,560059,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Kengeri S.O,560060,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Subramanyapura S.O,560061,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Doddakallasandra S.O,560062,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bommanahalli S.O (Bengaluru),560068,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
B Sk II Stage S.O,560070,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Kumbalagodu S.O,560074,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bannerghatta Road S.O,560076,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
J P Nagar S.O,560078,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Chandapura S.O,560081,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Udaypura S.O,560082,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bannerghatta S.O,560083,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Banashankari III Stage S.O,560085,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Koramangala VI Bk S.O,560095,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Rajarajeshwarinagar S.O,560098,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bommasandra Industrial Estate S.O,560099,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Electronics City S.O,560100,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
HSR Layout S.O,560102,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Jigani S.O,560105,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Anjanapura S.O,560108,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Thalaghattapura S.O,560109,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Ullalu Upanagar S.O,560110,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Kumaraswamy Layout S.O,560111,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Begur,560114,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Kaggalipura P.O,560116,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
CPC ITD BNPL booking HUB,560500,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Bengaluru City S.O,560002,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530003,21610001
Malleswaram S.O,560003,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
K. G. Road S.O,560009,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG South,21530004,21610001
Rajajinagar H.O,560010,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Science Institute S.O,560012,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Jalahalli H.O,560013,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Jalahalli West S.O,560015,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Seshadripuram S.O,560020,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Srirampuram S.O,560021,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Yeswanthpura S.O,560022,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Magadi Road S.O,560023,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Vijayanagar S.O (Bengaluru),560040,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Msrit S.O,560054,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Malleswaram West S.O,560055,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Peenya Dasarahalli S.O,560057,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Peenya Small Industries S.O,560058,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Nagarbhavi S.O,560072,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Nagasandra S.O (Bengaluru),560073,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Basaveshwaranagar S.O,560079,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Mahalakshmipuram Layout S.O,560086,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Hessarghatta S.O,560088,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Hessarghatta Lake S.O,560089,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Chikkabanavara S.O,560090,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Viswaneedam S.O,560091,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Nandinilayout S.O,560096,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Vidyaranyapura S.O,560097,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Hampinagar S.O,560104,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Achitnagar S.O,560107,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Kodigehalli S.O,560112,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG West,21530004,21610001
Kudur S.O,561101,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Veeregowdanadoddi S.O,561201,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Dodballapura S.O,561203,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Doddabelavangala S.O,561204,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Melekote S.O,561205,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Anekal S.O,562106,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG SOUTH,21530003,21610001
Attibele S.O,562107,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG SOUTH,21530003,21610001
Bevur S.O (Ramanagar),562108,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Bidadi S.O,562109,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Devanahalli S.O,562110,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Dobbespet S.O,562111,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Harohalli S.O,562112,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Hoskote S.O,562114,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Kanakapura S.O,562117,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Kodihalli S.O,562119,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Magadi S.O,562120,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Maralavadi S.O,562121,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Nandagudi S.O,562122,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,KOLAR,21530027,21610001
Nelamangala S.O,562123,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Sarjapura S.O,562125,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG SOUTH,21530003,21610001
Sathanur S.O,562126,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Solur S.O,562127,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Sugganahalli S.O,562128,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Sulebele S.O,562129,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Tavarekere S.O (Bengaluru),562130,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Thippasandra S.O,562131,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Tyamagondlu S.O,562132,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Vijayapura S.O,562135,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Honganur S.O,562138,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Bagalur S.O (Bengaluru),562149,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Bettahalsur S.O,562157,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Ramanagaram S.O,562159,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Channapatna H.O,562160,Delivery,HO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Government Silk Farm S.O,562161,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,Channapatna,21530005,21610001
Madanayakanahalli S.O,562162,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Nagadenahalli S.O,562163,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG WEST,21530004,21610001
Avathi S.O,562164,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Budigere S.O,562165,Delivery,PO,Karnataka Circle,Bengaluru HQ Region,BG EAST,21530001,21610001
Bagalkot H.O,587101,Delivery,HO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Gaddankeri Cross S.O,587102,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Bagalkot Navanagar S.O,587103,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Bagalkot UHS Campus S.O,587104,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Bagalkot Alokudyog S.O,587111,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Amingad S.O,587112,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Belagali S.O,587113,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Belur S.O (Bagalkot),587114,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Bevur S.O (Bagalkot),587115,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Bilgi S.O (Bagalkot),587116,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Galagali S.O,587117,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Hungund S.O,587118,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Hunnur S.O,587119,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Kamatgi S.O,587120,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Konnur S.O (Bagalkot),587121,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Lokapur S.O,587122,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Sulebhavi S.O,587124,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Ilkal S.O,587125,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Ilkal  Alampurpet S.O,587154,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Kulgeri Cross S.O,587155,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Shirur S.O,587156,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Badami S.O,587201,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Gudur S.O (Bagalkot),587202,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Guledgudd S.O,587203,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Kaladgi S.O,587204,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Katageri S.O,587205,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Kerur S.O,587206,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Rampur S.O (Bagalkot),587207,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Jamkhandi H.O,587301,Delivery,HO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Banahatti S.O,587311,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Mahalingpur S.O,587312,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Mudhol (Bagalkot) S.O,587313,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Rabkavi S.O,587314,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Terdal S.O,587315,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Sameerwadi S.O,587316,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Savalagi S.O,587330,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
HIPPARGI SO,587331,Delivery,PO,Karnataka Circle,North Karnataka Region,Bagalkot,21530006,21610002
Ballari H.O,583101,Delivery,HO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ballari Cowl Bazar S.O,583102,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ballari Gandhinagar S.O,583103,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ballari Cantonment S.O,583104,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ballari Jnanasagara S.O,583105,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Chellakurki S.O,583111,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Deogiri S.O,583112,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Emmiganur S.O,583113,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hatcholi S.O,583114,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kudathini S.O,583115,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kurugodu S.O,583116,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Moka S.O,583117,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
D T Ship S.O,583118,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Sandur S.O,583119,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Sirigere S.O(Ballari),583120,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Siruguppa S.O,583121,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Tekkalakota S.O,583122,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Toranagallu S.O,583123,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Yeshwantnagar S.O(Ballari),583124,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Arasikere S.O,583125,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Chikkajogihalli S.O,583126,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Chigatere S.O,583127,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Choranur S.O,583128,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Devalapura S.O(Ballari),583129,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Gudekota S.O,583130,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Harapanahalli S.O,583131,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kampli S.O,583132,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kottur S.O(Ballari),583134,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kudligi S.O,583135,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Oojein S.O,583136,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Teligi S.O,583137,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ballari Thermal Power Station S.O,583152,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Shankar Hill Town Colony S.O.,583153,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Karur SO,583154,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kolur S.O,583155,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hosapete H.O,583201,Delivery,HO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hosapete N C C S.O,583203,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Chitwadgi S.O,583211,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hagaribommanahalli S.O,583212,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Halavagalu S.O,583213,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hampasagara S.O,583214,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hampi Power House S.O,583215,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hirehadagali S.O,583216,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Holalu S.O,583217,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hosahalli S.O,583218,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Huvinahadagali S.O,583219,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Ittigi S.O,583220,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Kamalapura S.O,583221,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Mariammanahalli S.O,583222,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Papinayakanahalli S.O,583223,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Thambrahalli S.O,583224,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
T B Dam S.O,583225,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Hampi S.O,583239,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Vidyanagar S.O(Ballari),583275,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
K U Campus S.O,583276,Delivery,PO,Karnataka Circle,North Karnataka Region,Ballari,21530007,21610002
Belagavi H.O,590001,Delivery,HO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi Shahapur S.O,590003,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi M. Vadgaon S.O,590005,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Tilakwadi S.O,590006,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Udyambag S.O,590008,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi Records MLI S.O,590009,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi Nehru Nagar S.O,590010,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Hindawadi S.O,590011,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Peeranwadi S.O,590014,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Kanabargi S.O,590015,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi Shivaji Nagar S.O,590016,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi MalMaruti Extension S.O,590017,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
VTU Campus Belagavi S.O,590018,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Belagavi Doordarshan Nagar S.O,590019,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Suvarna Soudha Belagavi S.O,590020,Delivery,PO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Bailhongal H.O,591102,Delivery,HO,Karnataka Circle,North Karnataka Region,Belagavi,21530008,21610002
Dharwad H.O,580001,Delivery,HO,Karnataka Circle,North Karnataka Region,Dharwad,21530011,21610002
Hubballi H.O,580020,Delivery,HO,Karnataka Circle,North Karnataka Region,Dharwad,21530011,21610002
Gadag H.O,582101,Delivery,HO,Karnataka Circle,North Karnataka Region,Gadag,21530012,21610002
Kalaburagi H.O,585101,Delivery,HO,Karnataka Circle,North Karnataka Region,Kalaburagi,21530015,21610002
Karwar H.O,581301,Delivery,HO,Karnataka Circle,North Karnataka Region,Karwar,21530016,21610002
Raichur H.O,584101,Delivery,HO,Karnataka Circle,North Karnataka Region,Raichur,21530018,21610002
Sirsi H.O,581401,Delivery,HO,Karnataka Circle,North Karnataka Region,Sirsi,21530019,21610002
Vijayapura H.O,586101,Delivery,HO,Karnataka Circle,North Karnataka Region,Vijayapura,21530020,21610002
Davangere H.O,577001,Delivery,HO,Karnataka Circle,South Karnataka Region,Davanagere,21530024,21610003
Hassan H.O,573201,Delivery,HO,Karnataka Circle,South Karnataka Region,Hassan,21530025,21610003
Madikeri H.O,571201,Delivery,HO,Karnataka Circle,South Karnataka Region,Kodagu,21640085,21610003
Kolar H.O,563101,Delivery,HO,Karnataka Circle,South Karnataka Region,Kolar,21530027,21610003
Mandya H.O,571401,Delivery,HO,Karnataka Circle,South Karnataka Region,Mandya,21530028,21610003
Mangaluru H.O,575001,Delivery,HO,Karnataka Circle,South Karnataka Region,Mangaluru,21530029,21610003
Mysuru H.O,570001,Delivery,HO,Karnataka Circle,South Karnataka Region,Mysuru,21530030,21610003
Tumakuru H.O,572101,Delivery,HO,Karnataka Circle,South Karnataka Region,Tumkur,21530034,21610003
Udupi HO,576101,Delivery,HO,Karnataka Circle,South Karnataka Region,Udupi,21530035,21610003
Shivamogga H.O,577201,Delivery,HO,Karnataka Circle,South Karnataka Region,Shimoga,21530033,21610003
"""

def seed_full_data():
    reader = csv.DictReader(CSV_DATA.strip().splitlines())
    session = SQLiteSession()
    count = 0
    try:
        for row in reader:
            raw_pin = re.sub(r'\D', '', row.get("Pincode", ""))
            if len(raw_pin) != 6:
                continue
            pin = int(raw_pin)
            office_name = row.get("Office Name", "").strip()
            division = row.get("Division", "").strip()
            region = row.get("Region", "").strip()

            existing = session.query(PincodeMaster).filter_by(pincode=pin).first()
            if existing:
                existing.office_name = office_name
                existing.division = division
                existing.region = region
                session.merge(existing)
            else:
                rec = PincodeMaster(
                    pincode=pin,
                    office_name=office_name,
                    division=division,
                    region=region
                )
                session.add(rec)
            count += 1
        session.commit()
        print(f"[OK] Successfully processed and seeded {count} post offices into SQLite.")
    finally:
        session.close()

if __name__ == "__main__":
    seed_full_data()
