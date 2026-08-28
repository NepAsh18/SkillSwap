package spring_swap.v2.models.auth;



import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "user_id")
    private UUID id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 300)
    private String email;

    @Column(nullable = false)
    private String password;

    private String picture;

    @Column(length = 100)
    private String username;

    @Column(name = "linkedin_link", length = 200)
    private String linkedinLink;

    @Column(name = "github_link", length = 200)
    private String githubLink;

    @Column(name = "portfolio_link", length = 500)
    private String portfolioLink;

    @Column(length = 2000)
    private String bio;

    // Simple skill lists stored as comma-separated strings (or separate tables)
    @Column(name = "skills_proficient", length = 2000)
    private String skillsProficient;   // e.g. "Java,Spring,React"

    @Column(name = "skills_to_learn", length = 2000)
    private String skillsToLearn;

    // Relationships (One-to-Many)
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Education> educationList = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Project> projectList = new ArrayList<>();

    // multiple auth
    @Enumerated(EnumType.STRING)
    private Provider provider = Provider.LOCAL;
    private  String providerId;

    // Roles
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    // Timestamps
    private Instant createdAt;
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }


    private Instant lastOtpVerifiedAt;
}