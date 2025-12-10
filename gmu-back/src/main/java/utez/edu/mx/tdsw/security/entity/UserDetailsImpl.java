package utez.edu.mx.tdsw.security.entity;

import utez.edu.mx.tdsw.models.user.Users;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.util.Collection;
import java.util.Set;

public class UserDetailsImpl implements UserDetails {

    private String email;
    private String password;
    private boolean blocked;
    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(String email, String password, boolean blocked, Collection<? extends GrantedAuthority> authorities) {
        this.email = email;
        this.password = password;
        this.blocked = blocked;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(Users user){
        Set<SimpleGrantedAuthority> authorities = Set.of(new SimpleGrantedAuthority(user.getRole().getName()));

        return new UserDetailsImpl(
                user.getEmail(), user.getPassword(), user.getStatus(),authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return blocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
