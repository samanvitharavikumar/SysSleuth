import subprocess


def get_recent_logs(service_name, lines=50):
    """
    Get recent Docker logs for a service.
    """

    result = subprocess.run(
        [
            "docker",
            "compose",
            "logs",
            "--tail",
            str(lines),
            service_name
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        return []

    return result.stdout.splitlines()