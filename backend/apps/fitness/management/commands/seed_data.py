"""
Idempotent seed command: exercises, workout templates, achievements, and a demo user.

Run automatically on container start; safe to run repeatedly.
"""
import os
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.services import apply_metrics_to_profile
from apps.fitness.models import Exercise, Workout, WorkoutExercise
from apps.fitness.services import compute_daily_score
from apps.gamification.models import Achievement, Badge, GamificationProfile
from apps.social.models import Follow, Post, Challenge, Group, GroupMembership, GroupMessage

User = get_user_model()

EXERCISES = [
    ("Barbell Bench Press", "chest", "barbell", "intermediate"),
    ("Incline Dumbbell Press", "chest", "dumbbell", "beginner"),
    ("Push-up", "chest", "bodyweight", "beginner"),
    ("Pull-up", "back", "bodyweight", "intermediate"),
    ("Barbell Row", "back", "barbell", "intermediate"),
    ("Lat Pulldown", "back", "cable", "beginner"),
    ("Overhead Press", "shoulders", "barbell", "intermediate"),
    ("Lateral Raise", "shoulders", "dumbbell", "beginner"),
    ("Barbell Squat", "legs", "barbell", "intermediate"),
    ("Romanian Deadlift", "legs", "barbell", "intermediate"),
    ("Leg Press", "legs", "machine", "beginner"),
    ("Walking Lunge", "legs", "dumbbell", "beginner"),
    ("Bicep Curl", "biceps", "dumbbell", "beginner"),
    ("Triceps Pushdown", "triceps", "cable", "beginner"),
    ("Plank", "core", "bodyweight", "beginner"),
    ("Hanging Leg Raise", "core", "bodyweight", "advanced"),
    ("Hip Thrust", "glutes", "barbell", "intermediate"),
    ("Treadmill Intervals", "cardio", "machine", "beginner"),
]

WORKOUTS = [
    ("Push Day A", "push", "intermediate", [
        ("Barbell Bench Press", 4, "6-8", 120),
        ("Incline Dumbbell Press", 3, "8-12", 90),
        ("Overhead Press", 3, "8-10", 90),
        ("Lateral Raise", 3, "12-15", 60),
        ("Triceps Pushdown", 3, "12-15", 60),
    ]),
    ("Pull Day A", "pull", "intermediate", [
        ("Pull-up", 4, "6-10", 120),
        ("Barbell Row", 4, "8-10", 90),
        ("Lat Pulldown", 3, "10-12", 75),
        ("Bicep Curl", 3, "12-15", 60),
    ]),
    ("Leg Day A", "legs", "intermediate", [
        ("Barbell Squat", 4, "6-8", 150),
        ("Romanian Deadlift", 3, "8-10", 120),
        ("Leg Press", 3, "10-12", 90),
        ("Walking Lunge", 3, "12", 60),
    ]),
    ("Full Body Starter", "full_body", "beginner", [
        ("Push-up", 3, "8-12", 60),
        ("Lat Pulldown", 3, "10-12", 75),
        ("Leg Press", 3, "10-12", 90),
        ("Plank", 3, "45s", 45),
    ]),
]

ACHIEVEMENTS = [
    ("first_workout", "First Steps", "Complete your first workout.", "first_workout", 1, 50),
    ("workouts_10", "Getting Serious", "Complete 10 workouts.", "workouts_count", 10, 100),
    ("workouts_100", "Centurion", "Complete 100 workouts.", "workouts_count", 100, 500),
    ("streak_7", "On Fire", "Reach a 7-day streak.", "streak", 7, 120),
    ("streak_30", "Unstoppable", "Reach a 30-day streak.", "streak", 30, 400),
    ("weight_5", "First 5kg", "Lose your first 5kg.", "weight_lost", 5, 200),
    ("checkins_30", "Consistency King", "Log 30 daily check-ins.", "checkins_count", 30, 150),
]

BADGES = [
    ("early_adopter", "Early Adopter", "Joined during launch.", "gold", "rocket"),
    ("iron_will", "Iron Will", "30-day streak holder.", "silver", "flame"),
]


class Command(BaseCommand):
    help = "Seed the database with demo exercises, workouts, achievements and a user."

    def handle(self, *args, **options):
        self._seed_exercises()
        self._seed_workouts()
        self._seed_achievements()
        self._seed_badges()
        self._seed_demo_user()
        self._seed_admin()
        self._seed_social()
        self._seed_groups()
        self.stdout.write(self.style.SUCCESS("Seed complete."))

    def _seed_admin(self):
        """
        The admin can ban/delete any user, so we never seed a guessable password
        on a public deployment. Rules:
          • DEBUG (local dev): create admin@fitjourney.ai / admin12345 for convenience.
          • Production: only create the admin if ADMIN_EMAIL + ADMIN_PASSWORD env vars
            are set (you choose the credentials); otherwise skip it entirely so there
            is no default backdoor. Manage real admins via `createsuperuser`.
        """
        email = os.getenv("ADMIN_EMAIL", "admin@fitjourney.ai")
        if User.objects.filter(email=email).exists():
            return

        if settings.DEBUG:
            password = "admin12345"
        else:
            password = os.getenv("ADMIN_PASSWORD")
            if not password:
                self.stdout.write(
                    "  admin seed skipped (set ADMIN_EMAIL + ADMIN_PASSWORD, "
                    "or run createsuperuser, in production)"
                )
                return

        admin = User.objects.create_superuser(
            email=email, password=password, full_name="Site Admin", username="admin",
        )
        admin.profile.bio = "Keeping FitJourney AI safe."
        admin.profile.onboarding_completed = True
        admin.profile.save()
        GamificationProfile.objects.get_or_create(user=admin)
        shown = "admin12345" if settings.DEBUG else "(from ADMIN_PASSWORD)"
        self.stdout.write(self.style.SUCCESS(f"  admin created: {email} / {shown}"))

    def _seed_groups(self):
        groups = [
            ("Bodybuilding", "Build muscle, share splits, compare progress.", "dumbbell"),
            ("Weight Loss", "Support and accountability for fat loss journeys.", "trending-down"),
            ("Calisthenics", "Master your bodyweight.", "activity"),
            ("Powerlifting", "Squat, bench, deadlift — chase the total.", "anchor"),
            ("Running", "Log miles and chase PRs together.", "footprints"),
        ]
        admin = User.objects.filter(email="admin@fitjourney.ai").first()
        chatter = {
            "Bodybuilding": [
                ("mikebulk", "Anyone else chasing a 140kg bench this year? 💪"),
                ("fitqueen", "Volume + sleep is the cheat code honestly."),
            ],
            "Weight Loss": [
                ("fitqueen", "Down another 0.4kg this week — consistency wins."),
                ("norastrong", "Meal prep Sundays changed everything for me."),
            ],
        }
        for name, desc, icon in groups:
            group, _ = Group.objects.get_or_create(
                slug=slugify(name),
                defaults=dict(name=name, description=desc, icon=icon, created_by=admin),
            )
            for u in User.objects.filter(username__in=["fitqueen", "mikebulk", "norastrong"]):
                GroupMembership.objects.get_or_create(group=group, user=u)
            if not group.messages.exists():
                for handle, text in chatter.get(name, []):
                    sender = User.objects.filter(username=handle).first()
                    if sender:
                        GroupMessage.objects.create(group=group, sender=sender, content=text)
        self.stdout.write(f"  groups: {Group.objects.count()}")

    def _seed_exercises(self):
        for name, mg, equip, level in EXERCISES:
            Exercise.objects.get_or_create(
                slug=slugify(name),
                defaults=dict(name=name, muscle_group=mg, equipment=equip, level=level),
            )
        self.stdout.write(f"  exercises: {Exercise.objects.count()}")

    def _seed_workouts(self):
        for name, category, level, items in WORKOUTS:
            workout, _ = Workout.objects.get_or_create(
                slug=slugify(name),
                defaults=dict(name=name, category=category, level=level),
            )
            for order, (ex_name, sets, reps, rest) in enumerate(items):
                exercise = Exercise.objects.filter(slug=slugify(ex_name)).first()
                if exercise:
                    WorkoutExercise.objects.get_or_create(
                        workout=workout, exercise=exercise, order=order,
                        defaults=dict(sets=sets, reps=reps, rest_seconds=rest),
                    )
        self.stdout.write(f"  workouts: {Workout.objects.count()}")

    def _seed_achievements(self):
        for code, name, desc, trigger, threshold, xp in ACHIEVEMENTS:
            Achievement.objects.get_or_create(
                code=code,
                defaults=dict(name=name, description=desc, trigger=trigger,
                              threshold=threshold, xp_reward=xp),
            )
        self.stdout.write(f"  achievements: {Achievement.objects.count()}")

    def _seed_badges(self):
        for code, name, desc, tier, icon in BADGES:
            Badge.objects.get_or_create(
                code=code,
                defaults=dict(name=name, description=desc, tier=tier, icon=icon),
            )

    def _seed_demo_user(self):
        email = "demo@fitjourney.ai"
        if User.objects.filter(email=email).exists():
            self.stdout.write("  demo user already exists")
            return

        user = User.objects.create_user(
            email=email, password="demo12345",
            full_name="Demo Athlete", username="demo",
        )
        profile = user.profile
        profile.gender = "male"
        profile.age = 27
        profile.height_cm = 178
        profile.weight_kg = 82
        profile.activity_level = "moderate"
        profile.experience = "intermediate"
        profile.goal = "fat_loss"
        profile.weekly_training_days = 4
        profile.sleep_average_hours = 7
        profile.country = "Morocco"
        profile.bio = "On a recomposition journey. Chasing a leaner, stronger me."
        apply_metrics_to_profile(profile)
        profile.onboarding_completed = True
        profile.is_premium = True  # demo can try the AI Coach chat
        profile.save()

        GamificationProfile.objects.get_or_create(user=user, defaults={"xp": 320})

        # A fortnight of check-ins so charts and the coach have data.
        from apps.fitness.models import DailyCheckin
        today = timezone.now().date()
        weight = 84.0
        for i in range(14, 0, -1):
            day = today - timedelta(days=i)
            weight -= 0.12
            checkin = DailyCheckin(
                user=user, date=day,
                weight_kg=round(weight, 1),
                calories=2100 + (i % 3) * 90,
                protein_g=160 - (i % 4) * 10,
                carbs_g=210, fat_g=60,
                water_ml=2600 - (i % 3) * 300,
                sleep_hours=7.5 - (i % 5) * 0.6,
                workout_completed=(i % 2 == 0),
                mood="good", energy_level=7,
            )
            checkin.daily_score = compute_daily_score(checkin, profile)
            checkin.save()

        self.stdout.write(self.style.SUCCESS(f"  demo user created: {email} / demo12345"))

    def _seed_social(self):
        community = [
            ("sarah@fitjourney.ai", "fitqueen", "Sarah Lopez", "fat_loss", 1840,
             "Down 9kg and feeling unstoppable 💪 consistency is everything."),
            ("mike@fitjourney.ai", "mikebulk", "Mike Turner", "muscle_gain", 2620,
             "Bulk season in full swing. New bench PR today: 120kg x5 🔥"),
            ("amine@fitjourney.ai", "aminefit", "Amine Haddad", "recomposition", 990,
             "Leg day complete. Recomp is slow but the mirror doesn't lie."),
            ("nora@fitjourney.ai", "norastrong", "Nora Benali", "lean_bulk", 3120,
             "30-day streak unlocked! Who's joining the summer challenge?"),
        ]
        demo = User.objects.filter(email="demo@fitjourney.ai").first()
        for em, handle, name, goal, xp, post_text in community:
            if User.objects.filter(email=em).exists():
                continue
            u = User.objects.create_user(email=em, password="demo12345",
                                         full_name=name, username=handle)
            p = u.profile
            p.gender = "female" if handle in ("fitqueen", "norastrong") else "male"
            p.age, p.height_cm, p.weight_kg = 28, 172, 70
            p.goal, p.experience, p.activity_level = goal, "intermediate", "active"
            p.bio = post_text
            p.country = "Morocco"
            apply_metrics_to_profile(p)
            p.onboarding_completed = True
            p.save()
            GamificationProfile.objects.update_or_create(user=u, defaults={"xp": xp})
            Post.objects.create(author=u, post_type="update", content=post_text)
            if demo:
                Follow.objects.get_or_create(follower=demo, following=u)

        if demo and not Post.objects.filter(author=demo).exists():
            Post.objects.create(
                author=demo, post_type="milestone",
                content="Just hit my 14-day streak on FitJourney AI 🎯 small steps, big change.",
            )

        challenges = [
            ("30 Day Workout Challenge", "Train every day for 30 days.", "flame", 30, "days"),
            ("100 Pushups Daily", "Knock out 100 pushups every day.", "muscle", 100, "reps"),
            ("Drink 3L Water Daily", "Stay hydrated — 3 litres a day.", "droplet", 3, "litres"),
            ("Summer Cut Challenge", "Lose 5kg before summer.", "sun", 5, "kg"),
        ]
        for title, desc, icon, target, unit in challenges:
            Challenge.objects.get_or_create(
                slug=slugify(title),
                defaults=dict(title=title, description=desc, icon=icon,
                              target_value=target, unit=unit),
            )
        self.stdout.write(f"  social: {User.objects.count()} users, "
                          f"{Post.objects.count()} posts, {Challenge.objects.count()} challenges")
