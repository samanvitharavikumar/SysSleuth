import subprocess


def get_recent_logs(service_name, lines=500):
    """
    Get recent Docker logs for a service container.
    """
    result = subprocess.run(
        [
            "docker",
            "logs",
            "--tail",
            str(lines),
            service_name
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(
            f"Failed to collect logs for {service_name}: "
            f"{result.stderr}"
        )
        return []

    logs = [
        line
        for line in result.stdout.splitlines()
        if "GET /metrics" not in line
    ]

    return logs