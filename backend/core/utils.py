# backend/core/utils.py
"""
Utility: auto-assign 2 recommended teams to a newly registered user.
Called from the registration serializer after user creation.
"""

from teams.models import Team, TeamMembership   # ← fixed: was 'from backend.teams.models'


def assign_recommended_teams(user):
    """
    Assigns up to 2 teams to the user based on skill tag overlap.
    Falls back to the 2 most popular open teams if no skill match is found.
    """
    user_skills = set(skill.lower() for skill in (user.skills or []))
    assigned = 0

    if user_skills:
        candidate_teams = (
            Team.objects
            .filter(status='open')
            .exclude(members=user)
        )

        scored = []
        for team in candidate_teams:
            team_tags = set(tag.lower() for tag in (team.tags or []))
            overlap = len(user_skills & team_tags)
            if overlap > 0:
                scored.append((overlap, team))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_teams = [team for _, team in scored[:2]]

        for team in top_teams:
            TeamMembership.objects.get_or_create(
                team=team,
                user=user,
                defaults={'role': 'member'}
            )
            assigned += 1

    if assigned < 2:
        fallback_teams = (
            Team.objects
            .filter(status='open')
            .exclude(members=user)
            .order_by('-id')
        )[:2 - assigned]

        for team in fallback_teams:
            TeamMembership.objects.get_or_create(
                team=team,
                user=user,
                defaults={'role': 'member'}
            )

    return user
